package edu.uta.cse6331.assignment01.controller;

import org.springframework.data.rest.webmvc.RepositoryRestController;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;


/*@BasePathAwareController
@RequestMapping("people")*/
@RepositoryRestController
@RequestMapping("/steganography")
@CrossOrigin
public class SteganographyController {

    final static int beginningString = 300;
    final static String delimiter = "~~~";

    @RequestMapping(value = "/uploadFile", method = RequestMethod.POST)
    @ResponseBody
    public void uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("message") String message, HttpServletResponse httpServletResponse) throws IOException {
        String str = new String(file.getBytes());
        String text = writeSecretMessage(str, message);
        httpServletResponse.setHeader("Content-Disposition", "attachment; filename=" + file.getOriginalFilename().substring(0, file.getOriginalFilename().indexOf(".")) + "withHideMessage.txt");
        httpServletResponse.getOutputStream().write(text.getBytes());
    }

    @RequestMapping(value = "/retrieveMessage", method = RequestMethod.POST)
    @ResponseBody
    public String retrieveSecretMessage(@RequestParam("file") MultipartFile file, HttpServletResponse httpServletResponse) throws IOException {
        String str = new String(file.getBytes());
        String secretMessage = getSecreatMessage(str);
        return secretMessage;
    }

    private String writeSecretMessage(String fileText, String sText) throws IOException {
        String fileTextToLowerText = fileText.toLowerCase();
        String sBinary = new BigInteger(sText.getBytes()).toString(2);

        String fileSubText = fileTextToLowerText.substring(beginningString);
        StringBuilder stringBuilder = new StringBuilder(fileSubText);
        int idx = 0;
        for (int i = 1; i < sBinary.length()+1 && idx < stringBuilder.length(); i++, idx = idx + 8) {
            while (!Character.isAlphabetic(stringBuilder.charAt(idx))){
                idx ++;
            }
            char ch = sBinary.charAt(i - 1);
            if(Character.getNumericValue(ch) == 1){
                stringBuilder.setCharAt(idx, Character.toUpperCase(stringBuilder.charAt(idx)));
            }
        }
        stringBuilder.insert(idx + 1, delimiter);
        return fileText.substring(0, beginningString) + stringBuilder.toString();
    }

    private String getSecreatMessage(String fileText) throws IOException {
        String text = fileText.substring(beginningString, fileText.indexOf(delimiter));

        StringBuilder stringBuilder = new StringBuilder();
        for(int idx = 0; idx < text.length()-1; idx = idx+8){
            while (!Character.isAlphabetic(text.charAt(idx))){
                idx ++;
            }
            if(Character.isUpperCase(text.charAt(idx))){
                stringBuilder.append("1");
            } else {
                stringBuilder.append("0");
            }

        }
        return new String(new BigInteger(stringBuilder.toString(), 2).toByteArray());
    }

}
